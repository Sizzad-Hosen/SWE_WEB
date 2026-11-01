import React, {
  createContext,
  type ComponentType,
  type ReactElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type RouteEntry = { name: string; params?: any };
type Navigation = {
  navigate: (name: string, params?: any) => void;
  replace: (name: string, params?: any) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  reset: (state: { routes: RouteEntry[]; index?: number }) => void;
  setParams: (params: any) => void;
  popToTop: () => void;
};

export type NativeStackScreenProps<ParamList, RouteName extends keyof ParamList> = {
  navigation: Navigation;
  route: { key: string; name: RouteName; params: ParamList[RouteName] };
};

const ParentNavigationContext = createContext<Navigation | null>(null);

export function NavigationContainer({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

type ScreenDefinition = {
  name: string;
  component: ComponentType<any>;
  initialParams?: any;
  options?: any;
};

function Screen(_props: ScreenDefinition) { return null; }

function Navigator({ children, initialRouteName, screenOptions: _screenOptions }: any) {
  const parentNavigation = useContext(ParentNavigationContext);
  const definitions = useMemo(() => React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => (child as ReactElement<ScreenDefinition>).props), [children]);
  const initial = initialRouteName ?? definitions[0]?.name;
  const [stack, setStack] = useState<RouteEntry[]>([{ name: initial }]);
  const current = stack[stack.length - 1];

  useEffect(() => {
    if (!definitions.some((definition) => definition.name === current?.name)) {
      setStack([{ name: initial }]);
    }
  }, [definitions, current?.name, initial]);

  const navigation = useMemo<Navigation>(() => ({
    navigate(name, params) {
      setStack((routes) => [...routes, { name, params }]);
      window.history.pushState({ screen: name }, '', `#/${name.toLowerCase()}`);
    },
    replace(name, params) {
      setStack((routes) => [...routes.slice(0, -1), { name, params }]);
      window.history.replaceState({ screen: name }, '', `#/${name.toLowerCase()}`);
    },
    goBack() {
      setStack((routes) => {
        if (routes.length > 1) return routes.slice(0, -1);
        parentNavigation?.goBack();
        return routes;
      });
    },
    canGoBack() { return stack.length > 1 || Boolean(parentNavigation?.canGoBack()); },
    reset(state) {
      const routes = state.routes?.length ? state.routes : [{ name: initial }];
      setStack(routes);
      const active = routes[state.index ?? routes.length - 1];
      window.history.replaceState({ screen: active.name }, '', `#/${active.name.toLowerCase()}`);
    },
    setParams(params) {
      setStack((routes) => [...routes.slice(0, -1), { ...routes[routes.length - 1], params: { ...routes[routes.length - 1].params, ...params } }]);
    },
    popToTop() { setStack((routes) => routes.slice(0, 1)); },
  }), [initial, parentNavigation, stack.length]);

  const definition = definitions.find((item) => item.name === current?.name) ?? definitions[0];
  if (!definition) return null;
  const Component = definition.component;
  const route = {
    key: `${definition.name}-${stack.length}`,
    name: definition.name,
    params: current?.params ?? definition.initialParams,
  };

  return (
    <ParentNavigationContext.Provider value={navigation}>
      <Component navigation={navigation} route={route} />
    </ParentNavigationContext.Provider>
  );
}

export function createNativeStackNavigator<_ParamList>() {
  return { Navigator, Screen };
}

export function useFocusEffect(effect: () => void | (() => void)) {
  useEffect(effect, [effect]);
}

export function useNavigation() {
  const navigation = useContext(ParentNavigationContext);
  if (!navigation) throw new Error('Navigation is unavailable outside a navigator.');
  return navigation;
}
