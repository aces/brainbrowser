(ns brainbrowser.minc
  (gen-class))

(defn read-minc [filename]
  (->> (.exec (Runtime/getRuntime) (str "mincextract -normalize -ascii " filename))
       .getInputStream
       clojure.java.io/reader
       line-seq
       (map (fn [number]
	      (Float/valueOf number)))))



