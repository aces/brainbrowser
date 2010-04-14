log = File.new("log/mniobjweb.log", "a+")
$stdout.reopen(log)
$stderr.reopen(log)


