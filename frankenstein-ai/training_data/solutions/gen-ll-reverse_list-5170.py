# Task: gen-ll-reverse_list-5170 | Score: 100% | 2026-02-11T12:09:28.394471

n = int(input())
linked_list = []
for _ in range(n):
  linked_list.append(int(input()))

reversed_list = linked_list[::-1]
print(*reversed_list)