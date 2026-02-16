# Task: gen-ll-reverse_list-5071 | Score: 100% | 2026-02-13T09:04:59.303922

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

reversed_list = linked_list[::-1]
print(*reversed_list)