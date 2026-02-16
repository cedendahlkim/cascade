# Task: gen-ll-reverse_list-6344 | Score: 100% | 2026-02-12T13:43:58.188331

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)