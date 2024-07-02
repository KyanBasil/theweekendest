require "csv"
require 'json'

stations = {}

stations_csv = File.read(File.join(__dir__, 'Stations.csv'))
csv = CSV.parse(stations_csv, headers: true)
csv.each do |row|
  stations[row['GTFS Stop ID']] = {
    name: row['Stop Name'],
    longitude: row['GTFS Longitude'].to_f,
    latitude: row['GTFS Latitude'].to_f,
    borough: row['Borough'],
    north: {},
    south: {}
  }
end

puts "Compiled Stations"

["1", "2", "3", "4", "5", "6", "7", "A-1", "A-2", "B", "C", "D-1", "D-2", "D-3", "E", "F", "FS", "G", "GS", "H", "J", "L", "M", "N-1", "N-2", "Q", "R", "SI"].each do |route|
  shape_file = File.join(__dir__, 'shapes', "#{route}.csv")
  puts "Attempting to read file: #{shape_file}"
  
  begin
    shape_csv = File.read(shape_file)
    csv = CSV.parse(shape_csv, headers: false)
    last_stations = []
    path = []
    csv.each do |row|
      potential_stations = stations.select { |_, v| v[:latitude] == row[1].to_f && v[:longitude] == row[2].to_f }.map { |v| v[0]}
      if potential_stations.size > 0
        if last_stations.size > 0
          last_stations.each do |ls|
            potential_stations.each do |ps|
              stations[ls][:north][ps] = path
              stations[ps][:south][ls] = path.reverse
            end
          end
        end
        last_stations = potential_stations
        path = []
      else
        path << [row[2].to_f, row[1].to_f]
      end
    end
    puts "Processed #{route}"
  rescue Errno::ENOENT
    puts "Warning: File not found for route #{route}. Skipping."
  rescue => e
    puts "Error processing route #{route}: #{e.message}"
  end
end

puts "Writing to JSON file"

file = File.open(File.join(__dir__, "station_details.json"), "w")
file.puts stations.to_json
file.close

puts "JSON file created successfully"
