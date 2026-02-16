# Task: gen-ll-reverse_list-6778 | Score: 100% | 2026-02-12T17:37:27.579359

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)