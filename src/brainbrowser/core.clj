(ns brainbrowser.core
  (gen-class))

(use 'aleph.core 'aleph.http)

(defn brainbrowser [channel request]
  (enqueue-and-close channel
		     {:status 200
		      :headers {"Content-Type" "text/html"}
		      :body "Hello World!"}))

(defn -main [& args]
  (start-http-server brainbrowser {:port 8080}))





  
				  