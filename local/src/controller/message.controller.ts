import { Channel, ChannelModel, connect, Message } from "amqplib";
import { ERR_CODE, MQ_MSG, PAYLOAD_TYPE, SERVICE_NAME } from "../constants";
import { MqConenctionModel } from "../models";
import { serviceUtil } from "../util";
import aiController from "./ai.controller";
import deviceController from "./device.controller";
import LifecycleController from "./lifecycle.controller";
import webRTCController from "./webrtc.controller";

class MessageController {
  private channel?: Channel;
  private connection?: ChannelModel;
  private offerTimeoutTimer: NodeJS.Timeout | null = null;
  private machineId?: string;
  private candidateDebounce: NodeJS.Timeout | null = null;

  async subscribe(model: MqConenctionModel) {
    const { machineId, username, password } = model;
    this.machineId = machineId;

    const encodedUser = encodeURIComponent(username);
    const encodedPass = encodeURIComponent(password);

    const amqp = process.env.RABBITMQ_PROTOCOL || "amqp";

    const amqpUrl = `${amqp}://${encodedUser}:${encodedPass}@${process.env.AMQP_URL}`;

    console.log({ amqpUrl });

    const queueName = `q_device_${machineId}`;

    this.connection = await connect(amqpUrl);

    this.channel = await this.connection.createChannel();

    await this.channel.prefetch(1);

    await this.channel.consume(queueName, (msg) => {
      if (msg === null) {
        return;
      }
      this._consumer(msg);
    });
  }

  private _consumer = async (msg: Message) => {
    if (!this.channel) {
      return;
    }

    try {
      const payload = JSON.parse(msg.content.toString());

      console.log("Received Data:", payload);

      this._clearOfferTimeout();

      switch (payload.type) {
        case MQ_MSG.CLOSE:
          await webRTCController.dispose();
          this.channel.ack(msg);
          break;
        case MQ_MSG.DELETE:
          const lifecycle = LifecycleController.getInstance();

          this.channel.ack(msg);

          lifecycle.startMdns();
          await lifecycle.stopMqtt();

          break;
        case MQ_MSG.CHECK:
          if (payload.data === SERVICE_NAME.AI) {
            this.channel.ack(msg);

            const result = await serviceUtil.hasAIModel();

            this._publish({ type: MQ_MSG.CHECK, data: { result } });
          } else if (payload.data === SERVICE_NAME.MEDIA) {
            this.channel.ack(msg);

            const result = await serviceUtil.hasFfmpeg();

            this._publish({ type: MQ_MSG.CHECK, data: { result } });
          } else {
            this.channel.reject(msg, false);
          }

          break;
        case MQ_MSG.SIGNAL:
          await webRTCController.init(payload.data);
          console.log("[Init done]");
          this.channel.ack(msg);
          this._publish({ type: MQ_MSG.SIGNAL, data: { signal: true } });
          break;
        case MQ_MSG.OFFER:
          this.offerTimeoutTimer = setTimeout(() => {
            const errMsg =
              "[AMQP] Offer processing timeout. Rejecting message to prevent deadlock.";

            console.warn(errMsg);

            deviceController.sendErr(ERR_CODE.AMQT_OFFER_TIMEOUT, errMsg);

            this.channel?.reject(msg, false);
            webRTCController.dispose();
          }, 10000);

          const receivedOffer = await webRTCController.receiveOffer(
            payload.data,
          );

          this._clearOfferTimeout();

          if (receivedOffer) {
            const answer = await webRTCController.sendAnswer();

            if (!answer) {
              this.channel.reject(msg, false);
              return;
            }

            this._publish({ type: MQ_MSG.ANSWER, data: answer });

            this.channel.ack(msg);
          } else {
            deviceController.sendErr(
              ERR_CODE.AMQT_NULL_OFFER,
              `received data: ${msg.content.toString()}`,
            );
            this.channel.reject(msg, false);
          }
          break;
        case MQ_MSG.CANDIDATE:
          this.channel.ack(msg);

          await webRTCController.receiveIceCandidate(payload.data);

          this._clearCandidateDebounce();

          this.candidateDebounce = setTimeout(() => {
            webRTCController.iceCandidateQueue.forEach((model) => {
              if (!webRTCController.isConnected) {
                this._publish({
                  type: MQ_MSG.CANDIDATE,
                  data: model,
                });
              }
            });
          }, 100);
          break;
        case MQ_MSG.CONVERSATION:
          const { text, uuid } = payload.data;

          await aiController.askAI(text, (value) => {
            this._publish({
              type: MQ_MSG.CONVERSATION,
              data: { text: value, uuid },
            });
          });
          break;
        default:
          deviceController.sendErr(
            ERR_CODE.AMQT_UNKNOWN_TYPE,
            `received type: ${payload.type}`,
          );

          this.channel.reject(msg, false);
          break;
      }
    } catch (parseError) {
      console.error("Failed to process message:", parseError);

      deviceController.sendErr(ERR_CODE.AMQT_PARSE_ERROR, `${parseError}`);

      this.channel.reject(msg, false);
    }
  };

  private _publish = (payload: PAYLOAD_TYPE) => {
    if (!this.channel) {
      return;
    }

    const data =
      payload.data === null
        ? null
        : { machineId: this.machineId, ...payload.data };

    console.log("[mq]", payload.type);

    this.channel.publish(
      "",
      "q_global_upstream",
      Buffer.from(
        JSON.stringify({
          type: payload.type,
          data,
        }),
      ),
    );
  };

  private _clearOfferTimeout() {
    if (this.offerTimeoutTimer) {
      clearTimeout(this.offerTimeoutTimer);
      this.offerTimeoutTimer = null;
    }
  }

  private _clearCandidateDebounce() {
    if (this.candidateDebounce) {
      clearTimeout(this.candidateDebounce);
      this.candidateDebounce = null;
    }
  }

  async dispose() {
    this._clearOfferTimeout();
    this._clearCandidateDebounce();

    if (this.channel) {
      try {
        await this.channel.close();
      } catch (err) {
        console.error("[AMQP] Channel close error:", err);
        deviceController.sendErr(ERR_CODE.AMQT_CHANNEL_CLOSE, `${err}`);
      }
      this.channel = undefined;
    }

    if (this.connection) {
      try {
        await this.connection.close();
      } catch (err) {
        console.error("[AMQP] Connection close error:", err);

        deviceController.sendErr(ERR_CODE.AMQT_CONNECTION_CLOSE, `${err}`);
      }
      this.connection = undefined;
    }
  }
}

export default new MessageController();
