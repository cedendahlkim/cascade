# Task: gen-ll-reverse_list-4748 | Score: 100% | 2026-02-12T16:45:20.209248

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(input())

linked_list.reverse()
print(*linked_list)