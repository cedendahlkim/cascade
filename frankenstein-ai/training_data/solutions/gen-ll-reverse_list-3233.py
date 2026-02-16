# Task: gen-ll-reverse_list-3233 | Score: 100% | 2026-02-12T13:59:08.867067

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

reversed_list = linked_list[::-1]
print(*reversed_list)