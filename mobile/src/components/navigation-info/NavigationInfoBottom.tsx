import { View, Text } from 'react-native'
import React from 'react'
import BottomDrawer from '../BottomDrawer';
import useNavigationInfo from '../../hooks/useNavigationInfo';

interface NavigationInfoBottomProps {
    visible:boolean;
    onClose: () => void;
}

const NavigationInfoBottom = ({visible, onClose}:NavigationInfoBottomProps) => {
  const pathDistance = useNavigationInfo((state) => state.pathDistance);
  const pathDuration = useNavigationInfo((state) => state.pathDuration);
  return (
    <BottomDrawer 
    visible={visible}
    onClose={onClose}
    snapPoints={['25%']}>
        <View>
      <Text>Estimated Time Arrival</Text>
      <Text>{pathDuration}</Text>
      <Text>Distance</Text>
      <Text>{pathDistance}</Text>
    </View>
    </BottomDrawer>
    
  )
}

export default NavigationInfoBottom