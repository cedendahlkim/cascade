# Task: gen-ll-reverse_list-6900 | Score: 100% | 2026-02-12T13:48:50.762956

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(input())

reversed_list = linked_list[::-1]
print(*reversed_list)