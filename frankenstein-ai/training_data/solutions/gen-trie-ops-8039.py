# Task: gen-trie-ops-8039 | Score: 100% | 2026-02-11T19:45:12.515489

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.count = 0

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
            node.count += 1
        node.is_end = True

    def search(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end

    def prefix(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return 0
            node = node.children[char]
        return node.count

n = int(input())
trie = Trie()

for _ in range(n):
    line = input().split()
    op = line[0]
    word = line[1]

    if op == 'INSERT':
        trie.insert(word)
    elif op == 'SEARCH':
        if trie.search(word):
            print('true')
        else:
            print('false')
    elif op == 'PREFIX':
        print(trie.prefix(word))