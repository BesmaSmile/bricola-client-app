import React, {useEffect, useState} from 'react';
import {StyleSheet} from 'react-native';

import HomeStack from './HomeStack';
import FavoriteStack from './FavoriteStack';
import HistoryScreen from 'src/screens/HistoryScreen';
import TabBarIcon from 'src/components/TabBarIcon';
import RatingModal from 'src/components/RatingModal';
import PriceSuggestionModal from 'src/components/PriceSuggestionModal';
import PartnerResponseModal from 'src/components/PartnerResponseModal';
import colors from 'src/constants/colors';
import userService from 'src/services/user.service';
import {getAuth} from 'src/store/reducers/userReducer';
import {createMaterialBottomTabNavigator} from '@react-navigation/material-bottom-tabs';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import orderService from 'src/services/order.service';

import {EventRegister} from 'react-native-event-listeners';
import messaging from '@react-native-firebase/messaging';

const Tab = createMaterialBottomTabNavigator();

const MainTabNavigator = props => {
  const [ratingModal, setRatingModal] = useState({open: false});
  const [partnerResponseModal, setPartnerResponseModal] = useState({
    open: false,
  });

  const [priceSuggestionModal, setPriceSuggestionModal] = useState({
    open: false,
  });

  useEffect(() => {
    if (props.auth) {
      const unsubscribe = userService.storeToken(props.auth);
      return unsubscribe;
    }
  }, [props.auth]);

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log(
        'A new FCM message arrived!',
        JSON.parse(remoteMessage.data.content),
      );
      const content = JSON.parse(remoteMessage.data.content);
      switch (remoteMessage.data.type) {
        case 'rating_request':
          setRatingModal({
            open: true,
            content,
          });
          break;
        case 'partner_price_suggestion':
          setPriceSuggestionModal({open: true, content});
          break;
        case 'partner_response':
          setPartnerResponseModal({
            open: true,
            response: JSON.parse(remoteMessage.data.content),
          });
          break;
      }
    });
    return unsubscribe;
  });

  useEffect(() => {
    EventRegister.on('rating_request', ratingRequest => {
      setRatingModal({open: true, content: ratingRequest});
      //setMapModalVisible(true)
    });
    EventRegister.on('partner_price_suggestion', content => {
      setPriceSuggestionModal({open: true, content});
    });
    EventRegister.on('partner_response', content => {
      setPartnerResponseModal({open: true, content});
    });
    return () => {
      EventRegister.rmAll();
    };
  });

  const closeRatingModal = () => {
    setRatingModal({open: false});
  };

  const closePriceSuggestionModal = () => {
    setPriceSuggestionModal({open: false});
  };

  const handleOkClick = () => {
    setPartnerResponseModal({open: false});
    props.loadOrders(props.auth);
    props.navigation.navigate('History');
  };

  return (
    <>
      {ratingModal.open && (
        <RatingModal
          order={ratingModal.content.order}
          close={closeRatingModal}
        />
      )}
      {partnerResponseModal.open && (
        <PartnerResponseModal
          response={partnerResponseModal.response}
          handleOkClick={handleOkClick}
        />
      )}
      {priceSuggestionModal.open && (
        <PriceSuggestionModal
          suggestion={priceSuggestionModal.content}
          close={closePriceSuggestionModal}
        />
      )}
      <Tab.Navigator
        barStyle={styles.bar}
        activeColor={colors.darkColor}
        inactiveColor={colors.disabledColor}>
        <Tab.Screen
          name="Home"
          options={{
            tabBarLabel: 'Accueil',
            tabBarIcon: ({color}) => <TabBarIcon name="home" color={color} />,
          }}
          component={HomeStack}
        />
        <Tab.Screen
          name="History"
          options={{
            tabBarLabel: 'Historique',
            tabBarIcon: ({color}) => <TabBarIcon name="clock" color={color} />,
          }}
          component={HistoryScreen}
        />
        <Tab.Screen
          name="Favorite"
          options={{
            tabBarLabel: 'Favoris',
            tabBarIcon: ({color}) => (
              <TabBarIcon name="bookmark" color={color} />
            ),
          }}
          component={FavoriteStack}
        />
      </Tab.Navigator>
    </>
  );
};

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#eee',
  },
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadOrders: orderService.loadOrders,
    },
    dispatch,
  );

const mapStateToProps = state => ({
  auth: getAuth(state.user),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MainTabNavigator);
