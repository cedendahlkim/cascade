# Task: gen-ll-reverse_list-1244 | Score: 100% | 2026-02-12T13:17:16.835931

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(input())

reversed_list = linked_list[::-1]
print(*reversed_list)