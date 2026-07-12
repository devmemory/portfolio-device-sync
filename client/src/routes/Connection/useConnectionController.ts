import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { CONNECTION_STATE, CONNECTION_TYPE } from "src/constants";
import { WebRTCService } from "src/services/socket/webRTC";
import { popupEventBus } from "src/utils/popupUtil";

const useConnectionController = () => {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);

  const service = useRef<WebRTCService | null>(null);
  const [connection, setConnection] = useState<CONNECTION_TYPE>(
    CONNECTION_STATE.offline,
  );

  useEffect(() => {
    const deviceId = Number(id);

    if (!deviceId || isNaN(deviceId)) {
      popupEventBus.emit("Invalid device id");
      return;
    }

    service.current = new WebRTCService(deviceId);

    service.current.video = videoRef.current;
    service.current.initListner();

    const unsubscribeConnection = service.current.onChangeConnection(() => {
      setConnection(service.current!.connectionState);
    });

    return () => {
      unsubscribeConnection();
      service.current?.disposeAll();
      service.current = null;
    };
  }, []);

  const onConnect = () => {
    service.current?.initPeer();
    service.current?.sendOffer();
  };

  const onDisconnect = () => {
    service.current?.disposePeer();
  };

  return {
    id,
    videoRef,
    connection,
    onConnect,
    onDisconnect,
  };
};

export default useConnectionController;
