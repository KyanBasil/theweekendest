require "csv"
require 'json'

transfers = []

transfers_file = File.join(__dir__, 'transfers.txt')
puts "Attempting to read file: #{transfers_file}"

begin
  transfers_txt = File.read(transfers_file)
  csv = CSV.parse(transfers_txt, headers: true)
  csv.each do |row|
    if row['from_stop_id'] != row['to_stop_id']
      transfers << {
        from: row['from_stop_id'],
        to: row['to_stop_id']
      }
    end
  end

  puts "Successfully processed transfers data"

  puts "Writing to JSON file"
  output_file = File.join(__dir__, "transfers.json")
  File.open(output_file, "w") do |file|
    file.puts transfers.to_json
  end

  puts "JSON file created successfully: #{output_file}"
rescue Errno::ENOENT
  puts "Error: The file 'transfers.txt' was not found in the expected location."
  puts "Please ensure that 'transfers.txt' is present in the following directory:"
  puts __dir__
rescue => e
  puts "An error occurred while processing the file: #{e.message}"
end
