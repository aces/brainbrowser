(ns brainbrowser.core
  (gen-class))

(use 'aleph.core 'aleph.http)
(use 'hiccup.core)

(defn ws-event-handler [channel]
  (do
    (println "WebSocket event received"))
  (receive-all channel (fn [msg] (enqueue channel "hello!"))))

(defn http-event-handler [channel request] 
  (do
    (println "HTTP event received"))
  (enqueue-and-close channel
		     {:status 200
		      :headers {"Content-Type" "text/html"}
		      :body "Hello World!"}))


(defn brainbrowser [channel request]
  (do (println request))
  (cond (request :websocket)
	(ws-event-handler channel)
	:else (http-event-handler channel request)))
(defn -main [& args]
  (start-http-server brainbrowser {:port 8080 :websocket true}))