# Task: gen-ll-reverse_list-1041 | Score: 100% | 2026-02-12T13:48:56.585931

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(input())

linked_list.reverse()
print(*linked_list)