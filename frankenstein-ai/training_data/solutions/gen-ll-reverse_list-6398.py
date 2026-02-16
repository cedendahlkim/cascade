# Task: gen-ll-reverse_list-6398 | Score: 100% | 2026-02-12T20:16:43.212136

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)