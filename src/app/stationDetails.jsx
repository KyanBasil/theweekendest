import React from 'react';
import ReactDOM from 'react-dom';
import { Responsive, Button, Icon, Header, Segment, List, Popup } from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";
import TrainBullet from './trainBullet.jsx';

import Cross from "./icons/cross-15.svg";

// M train directions are reversed between Essex St and Myrtle Av to match with J/Z trains
const mTrainShuffle = ["M18", "M16", "M14", "M13", "M12", "M11"];

class StationDetails extends React.Component {
  statusColor(status) {
    if (status == 'Good Service') {
      return 'green';
    } else if (status == 'Service Change') {
      return 'orange';
    } else if (status == 'Not Good') {
      return 'yellow';
    } else if (status == 'Delay') {
      return 'red';
    }
  }

  handleBack = _ => {
    this.props.history.goBack();
  }

  handleHome = _ => {
    this.props.history.push("/");
  }

  handleShare = _ => {
    navigator.share({
      title: `the weekendest - ${this.props.station.name.replace(/ - /g, "–")}`,
      text: `Real-time arrival times and routing information at ${this.props.station.name.replace(/ - /g, "–")} station on the Weekendest`,
      url: `https://www.theweekendest.com/stations/${this.props.station.id}`
    })
  }

  renderArrivalTimes(trainId, direction) {
    const { station, arrivals } = this.props;
    const currentTime = Date.now() / 1000;
    let actualDirection = direction;

    if (trainId === 'M' && mTrainShuffle.includes(station.id)) {
      actualDirection = direction === "north" ? "south" : "north";
    }

    if (!arrivals[trainId] || !arrivals[trainId].arrival_times[actualDirection]) {
      return;
    }

    const times = arrivals[trainId].arrival_times[actualDirection].flat().filter((estimate) => {
      return estimate.stop_id.substr(0, 3) === station.id && estimate.estimated_time >= currentTime;
    }).map((estimate) => {
      return Math.round((estimate.estimated_time - currentTime) / 60);
    }).sort((a, b) => a - b).slice(0, 2);

    return times.map((time) => {
      return `${time} min`;
    }).join(', ')
  }

  southDestinations() {
    const { routings, stations, station } = this.props;
    let destinations = [];
    Object.keys(routings).forEach((key) => {
      const route = routings[key];
      if (key !== 'M' || !mTrainShuffle.includes(station.id)) {
        route.routings.south.forEach((routing) => {
          if (routing.includes(station.id + "S")) {
            destinations.push(routing[routing.length - 1]);
          }
        })
      }
    })

    if (mTrainShuffle.includes(station.id)) {
      const route = routings["M"];
      route.routings.north.forEach((routing) => {
        if (routing.includes(station.id + "N")) {
          destinations.push(routing[routing.length - 1]);
        }
      })
    }

    return Array.from(new Set(destinations.map((s) => {
      const st = stations[s.substring(0, 3)];
      if (st) {
        return st.name;
      }
    }))).sort().join(', ').replace(/ - /g, "–");
  }

  northDestinations() {
    const { routings, stations, station } = this.props;
    let destinations = [];
    Object.keys(routings).forEach((key) => {
      const route = routings[key];
      if (key !== 'M' || !mTrainShuffle.includes(station.id)) {
        route.routings.north.forEach((routing) => {
          if (routing.includes(station.id + "N")) {
            destinations.push(routing[routing.length - 1]);
          }
        })
      }
    })

    if (mTrainShuffle.includes(station.id)) {
      const route = routings["M"];
      route.routings.south.forEach((routing) => {
        if (routing.includes(station.id + "S")) {
          destinations.push(routing[routing.length - 1]);
        }
      })
    }

    return Array.from(new Set(destinations.map((s) => {
      const st = stations[s.substring(0, 3)];
      if (st) {
        return st.name;
      }
    }))).sort().join(', ').replace(/ - /g, "–");
  }

  render() {
    const { stations, station, trains } = this.props;
    return (
      <Segment className='details-pane'>
        <Responsive minWidth={Responsive.onlyTablet.minWidth} as='div' style={{padding: "14px"}}>
          <Button icon onClick={this.handleBack}>
            <Icon name='arrow left' />
          </Button>
          <Button icon onClick={this.handleHome}>
            <Icon name='map outline' />
          </Button>
          { navigator.share &&
            <Button icon onClick={this.handleShare} style={{float: "right"}}>
              <Icon name='external share' />
            </Button>
          }
          <Header as="h3" className='header-station-name'>
            { station.name.replace(/ - /g, "–") }
          </Header>
          { station.secondary_name &&
            <span className='header-secondary-name'>
              {
                station.secondary_name
              }
            </span>
          }
        </Responsive>
        <Responsive {...Responsive.onlyMobile} as='div' className="mobile-details-header">
          <Popup trigger={<Button icon='ellipsis horizontal' />} inverted
            on='click' hideOnScroll position='bottom left'>
            <Button icon onClick={this.handleBack}>
              <Icon name='arrow left' />
            </Button>
            <Button icon onClick={this.handleHome}>
              <Icon name='map outline' />
            </Button>
            { navigator.share &&
              <Button icon onClick={this.handleShare}>
                <Icon name='external share' />
              </Button>
            }
          </Popup>
          <Header as="h5" style={{margin: 0}}>
            { station.name.replace(/ - /g, "–") }
            <span className='header-secondary-name'>
              { station.secondary_name }
            </span>
          </Header>
        </Responsive>
        <div className="details-body">
          <Segment>
            <Header as="h5">
              To { this.southDestinations() }
            </Header>
            <div>
              <List divided relaxed>
                {
                  Array.from(station.southStops).sort().map((trainId) => {
                    const train = trains.find((t) => {
                      return t.id === trainId;
                    });
                    return (
                      <List.Item key={trainId}>
                        <List.Content floated='left' style={{marginRight: "0.5em"}}>
                          <TrainBullet name={train.name} id={trainId} color={train.color}
                            textColor={train.text_color} size='small' link />
                        </List.Content>
                        <List.Content floated='right' className="station-details-route-status">
                          <div>{ this.renderArrivalTimes(trainId, "south") }</div>
                          <Header as='h4' color={this.statusColor(train.direction_statuses.south)}>
                            { train.direction_statuses.south }
                          </Header>
                        </List.Content>
                      </List.Item>
                    );
                  })
                }
              </List>
            </div>
          </Segment>
          <Segment>
            <Header as="h5">
              To { this.northDestinations() }
            </Header>
            <div>
              <List divided relaxed>
                {
                  Array.from(station.northStops).sort().map((trainId) => {
                    const train = trains.find((t) => {
                      return t.id === trainId;
                    });
                    return (
                      <List.Item key={trainId}>
                        <List.Content floated='left'>
                          <TrainBullet name={train.name} id={trainId} color={train.color}
                            textColor={train.text_color} size='small' link />
                        </List.Content>
                        <List.Content floated='right' className="station-details-route-status">
                          <div>{ this.renderArrivalTimes(trainId, "north") }</div>
                          <Header as='h4' color={this.statusColor(train.direction_statuses.north)}>
                            { train.direction_statuses.north }
                          </Header>
                        </List.Content>
                      </List.Item>
                    );
                  })
                }
              </List>
            </div>
          </Segment>
          {
            station.transfers.size > 0 &&
            <Segment>
              <Header as="h4">
                Transfers
              </Header>
              <List divided relaxed selection>
              {
                Array.from(station.transfers).map((stopId) => {
                  const stop = stations[stopId];
                  if (!stop) {
                    return;
                  }
                  return(
                    <List.Item as={Link} key={stop.id} className='station-list-item' to={`/stations/${stop.id}`}>
                      <List.Content floated='left'>
                        <Header as='h5'>
                          { stop.name.replace(/ - /g, "–") }
                        </Header>
                      </List.Content>
                      { stop.secondary_name &&
                        <List.Content floated='left' className="secondary-name">
                          { stop.secondary_name }
                        </List.Content>
                      }
                      <List.Content floated='right'>
                        {
                          Array.from(stop.stops).sort().map((trainId) => {
                            const train = trains.find((t) => {
                              return t.id == trainId;
                            });
                            return (
                              <TrainBullet id={trainId} key={train.name} name={train.name} color={train.color}
                                textColor={train.text_color} size='small' key={train.id} />
                            )
                          })
                        }
                        {
                          stop.stops.size === 0 &&
                          <Cross style={{height: "21px", width: "21px", margin: "3.5px 1px 3.5px 3.5px"}} />
                        }
                      </List.Content>
                    </List.Item>
                  )
                })
              }
            </List>
            </Segment>
          }
        </div>
      </Segment>
    );
  }
}

export default withRouter(StationDetails)