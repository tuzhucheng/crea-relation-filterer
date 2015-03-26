#!/usr/bin/ruby -w

# Usage: Make sure ruby is installed. This file is written with Ruby 2.1.5
#
# ruby filter.rb > output.html
#



# Config files. Rename as necessary. 
# Make sure that they are in the same working directory
noun_file_name = "substrates.txt"
verb_file_name = "new-verbs.txt"
csv_file_name  = "relations.csv"



# Turn this into true for verbose debugging in STDERR
debug = true

noun_file = [] # array that will store the list of nouns
verb_file = [] # array that will store the list of verbs

# Catch all file IO exceptions
begin
    # Load in nouns file, stored in an array of strings => noun_file
    counter = 0
    File.open(noun_file_name) do |infile|
        while (line = infile.gets)
            noun_file[counter] = line.delete("\n")
            counter += 1
        end
    end

    # debug
    if debug
        STDERR.puts "---- Nouns ----"
        noun_file.each do |noun|
            STDERR.puts noun
        end
    end

    # Load in verbs file, stored in an array of strings => verb_file
    counter = 0
    File.open(verb_file_name) do |infile|
        while (line = infile.gets)
            verb_file[counter] = line.delete("\n")
            counter += 1
        end
    end

    # debug
    if debug
        STDERR.puts "---- Verbs ----"
        verb_file.each do |verb|
            STDERR.puts verb
        end
    end

    # Create a stream from the CSV file
    csv_file  = File.new(csv_file_name);
rescue => err
    STDERR.puts "Exception: #{err}"
    err
end


# Start buffering and reading in CSV File
while (csv_line = csv_file.gets)
    # Tokenize each CSV line by commas
    tokens = csv_line.split(",")
    
    # Store separately for better readability
    article_id = tokens[0]
    predicate = tokens[1]
    object = tokens[2]
    subject = tokens[3]
    keyword = tokens[4]

    # Some (later) lines of the CSV file has 7 arguments instead of 6
    # This will handle both cases.
    if tokens.length == 6
        timestamp = tokens[5]
    elsif tokens.length == 7
        misc = tokens[5]
        timestamp = tokens[6]
    end

    # debug
    #STDERR.puts "FILTERING: #{object} #{predicate} #{subject}" if debug


    matched_noun = false
    object_matched = false
    subject_matched = false
    noun_file.each do |noun|
        noun_strip = noun.delete("\n")
        # STDERR.puts "matching #{noun_strip} with #{object} and #{subject}"
        object_matched = false
        subject_matched = false
        if /#{noun_strip}/i =~ object # object is matched
            object_matched = true
            matched_noun = true
            break
        elsif /#{noun_strip}/i =~ subject # subject is matched 
            subject_matched = true
            matched_noun = true
            break
        end
    end

    next unless matched_noun # continue while if noun is not matched

    matched_verb = false
    verb_file.each do |verb|
        verb_strip = verb.delete("\n")
        # STDERR.puts "matching #{verb_strip} with #{predicate}"
        if /#{verb_strip}/i =~ predicate
            matched_verb = true
            # puts "MATCHED VERB!!! #{verb_strip} with #{predicate}"
            break
        end
    end


    # currently bolds the 
    if (matched_noun and matched_verb)
        if object_matched
            # puts "<p>MATCH: <b>#{object}</b> #{predicate} #{subject} <a href='http://www.ncbi.nlm.nih.gov/pubmed/#{article_id.delete("\"")}'>link</a></p>"
            puts "#{object.delete("\"")};#{predicate.delete("\"")};#{subject.delete("\"")};0;#{article_id.delete("\"")}\n"
        elsif subject_matched
            # puts "<p>MATCH: #{object} #{predicate} <b>#{subject}</b> <a href='http://www.ncbi.nlm.nih.gov/pubmed/#{article_id.delete("\"")}'>link</a></p>"
            puts "#{object.delete("\"")};#{predicate.delete("\"")};#{subject.delete("\"")};2;#{article_id.delete("\"")}\n"
        end
        # puts csv_line
    else
        STDERR.puts "FAIL: #{object} #{predicate} #{subject}"
    end

end

# Closes CSV stream
csv_file.close
