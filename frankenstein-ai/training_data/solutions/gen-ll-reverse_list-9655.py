# Task: gen-ll-reverse_list-9655 | Score: 100% | 2026-02-12T17:35:08.291904

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)