# Task: gen-ll-reverse_list-3111 | Score: 100% | 2026-02-12T17:35:08.520586

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)