#!/usr/bin/env ruby

t = Time.now
out = "#{t.year}_#{t.month}_#{t.day}_#{t.hour}_#{t.min}_#{t.sec}.db"
system("cp var/db/dev.db var/db/#{out}")
