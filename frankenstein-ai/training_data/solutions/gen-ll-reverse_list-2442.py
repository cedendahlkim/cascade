# Task: gen-ll-reverse_list-2442 | Score: 100% | 2026-02-12T13:17:46.953468

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

reversed_list = linked_list[::-1]
print(*reversed_list)