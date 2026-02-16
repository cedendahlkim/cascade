# Task: gen-ll-reverse_list-2643 | Score: 100% | 2026-02-12T15:42:30.064147

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

reversed_list = linked_list[::-1]
print(*reversed_list)