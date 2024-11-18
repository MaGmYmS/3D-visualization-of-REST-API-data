import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getAllNodes, getAllNodesWithRelationships, getNodeById } from './api';
import { createNode, createRelationship } from './components/Node';

console.log('main.js loaded');

// Количество отображаемых узлов
const NODE_LIMIT = 1000;

// Инициализация сцены
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
console.log('Camera position:', camera.position);

const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Добавление управления камерой
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
console.log('Camera target:', controls.target);

// Установка камеры 
camera.position.z = 20;

// Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Функция для назначения цвета узлу
const getNodeColor = (label) => {
    console.log('Node label:', label[0]);
    if (label[0] === 'User') {
        return 0x4682B4; // Темно-голубой для "User" (Steel Blue)
    } else if (label[0] === 'Group') {
        return 0x388E3C; // Темно-зеленый для "Group" (Forest Green)
    }
    return 0xD2B48C; // Темно-бежевый по умолчанию (Tan)
};

// Функция для назначения цвета связи
const getRelationshipColor = (relationshipType) => {
    console.log('Relationship type:', relationshipType);
    if (relationshipType === 'Follow') {
        return 0x4682B4; // Темно-голубой для "Follow" (Steel Blue)
    } else if (relationshipType === 'Subscribe') {
        return 0x388E3C; // Темно-зеленый для "Subscribe" (Forest Green)
    }
    return 0xFF69B4; // Темно-розовый для остальных (Hot Pink)
};

// Функция генерации координат узлов на поверхности сферы
const generateSphericalPositions = (numNodes, radius = 50) => {
    const positions = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2; // Золотое сечение для равномерного распределения

    for (let i = 0; i < numNodes; i++) {
        // Индекс узла i
        const y = 1 - (i / (numNodes - 1)) * 2; // Позиция по оси Y от -1 до 1
        const radiusAtY = Math.sqrt(1 - y * y); // Радиус для данной высоты (y)

        // Угол по оси X
        const theta = goldenRatio * i;

        // Преобразование в декартовы координаты
        const x = radiusAtY * Math.cos(theta) * radius;
        const z = radiusAtY * Math.sin(theta) * radius;

        positions.push({ x, y: y * radius, z });
    }

    return positions;
};

// Функция подготовки ограниченных узлов и позиций
const prepareLimitedNodes = (nodesWithRelationships) => {
    const limitedNodes = nodesWithRelationships.slice(0, NODE_LIMIT); // Ограничиваем узлы
    const nodeIdsSet = new Set(limitedNodes.map((n) => n.node.attributes.id)); // Множество ID ограниченных узлов
    const positionsMap = new Map();

    // Получаем позиции для узлов
    const positions = generateSphericalPositions(limitedNodes.length, 50); // 50 — радиус сферы

    const preparedNodes = limitedNodes.map((nodeObject, index) => {
        const node = nodeObject.node;

        // Используем заранее вычисленную позицию для этого узла
        const position = positions[index];
        positionsMap.set(node.attributes.id, position);

        // Оставляем только связи, указывающие на узлы в пределах ограничения
        const relationships = nodeObject.relationships.filter((rel) =>
            nodeIdsSet.has(rel.target_node.attributes.id)
        );

        return { node, relationships, position };
    });

    return { preparedNodes, positionsMap };
};

// Функция для рисования узлов
const drawNodes = (preparedNodes) => {
    const objects = []; // Для хранения узлов на сцене

    preparedNodes.forEach(({ node, relationships, position }) => {
        const color = getNodeColor(node.label); // Присваиваем цвет узлу
        const nodeMesh = createNode(position, color, node, relationships); // Создаем узел
        scene.add(nodeMesh); // Добавляем узел на сцену
        objects.push(nodeMesh); // Сохраняем узел для дальнейшей обработки
    });

    return objects; // Возвращаем массив узлов для вычисления центра масс
};

// Функция для рисования связей
const drawRelationships = (preparedNodes, positionsMap) => {
    preparedNodes.forEach(({ node, relationships }) => {
        const nodePosition = positionsMap.get(node.attributes.id);

        relationships.forEach((relationship) => {
            const targetNodeId = relationship.target_node.attributes.id;
            const targetPosition = positionsMap.get(targetNodeId);

            if (!targetPosition) {
                console.log(`No position for target node ${targetNodeId}. Skipping connection.`);
                return;
            }

            const relationshipColor = getRelationshipColor(relationship.relationship.type);
            const line = createRelationship(nodePosition, targetPosition, relationshipColor);
            scene.add(line); // Добавляем линию на сцену
        });
    });
};

// Основной процесс загрузки данных и рендера
getAllNodesWithRelationships().then(async (nodesWithRelationships) => {
    console.log('Loaded nodes with relationships:', nodesWithRelationships);

    // Подготовка узлов и позиций
    const { preparedNodes, positionsMap } = prepareLimitedNodes(nodesWithRelationships);
    console.log('Prepared nodes:', preparedNodes);

    // Рисуем узлы
    const objects = drawNodes(preparedNodes);

    // Рисуем связи
    drawRelationships(preparedNodes, positionsMap);

    // Устанавливаем центр масс как цель камеры
    const center = calculateCenterOfMass(objects);
    controls.target.set(center.x, center.y, center.z);
});


// Центр масс
const calculateCenterOfMass = (nodes) => {
    const center = { x: 0, y: 0, z: 0 };
    nodes.forEach(node => {
        center.x += node.position.x;
        center.y += node.position.y;
        center.z += node.position.z;
    });
    center.x /= nodes.length;
    center.y /= nodes.length;
    center.z /= nodes.length;
    return center;
};

renderer.domElement.addEventListener('click', (event) => {
    const mouse = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
    };

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;

        if (intersectedObject.userData && intersectedObject.userData.id) {
            const {
                id,
                label,
                home_town,
                screen_name,
                sex,
                name,
                relationships,
            } = intersectedObject.userData;

            console.log('Clicked Sphere Details:');
            console.log('ID:', id);
            console.log('Label:', label);
            console.log('Name:', name);
            console.log('Screen Name:', screen_name);
            console.log('Sex:', sex);
            console.log('Home Town:', home_town);
            console.log('Relationships:', relationships);

            const relationshipInfo = relationships.map((rel) => `
                <li>
                    <strong>Type:</strong> ${rel.relationship.type}<br>
                    <strong>Target Node ID:</strong> ${rel.target_node.attributes.id}
                </li>
            `).join('');

            const infoDiv = document.getElementById('info');
            infoDiv.innerHTML = `
                <strong>ID:</strong> ${id}<br>
                <strong>Label:</strong> ${label}<br>
                <strong>Name:</strong> ${name}<br>
                <strong>Screen Name:</strong> ${screen_name}<br>
                <strong>Sex:</strong> ${sex}<br>
                <strong>Home Town:</strong> ${home_town}<br>
                <strong>Relationships:</strong> <ul>${relationshipInfo}</ul>
            `;
        } else {
            console.log('No user data found for this object.');
        }
    }
});

// Анимация
const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
};
animate();
