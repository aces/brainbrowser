(ns bbwebsocket.server)
(use 'lamina.core 'aleph.http)

(defn handle-http-request [ch req]
  (enqueue channel
           {:status 200
            :header {"content-type" "text/html"}
            :body "Hello World!"}))
(defn start-bb-server []
  (start-http-server
   handle-http-request {:port 8080})
              