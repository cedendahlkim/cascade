# Task: gen-ll-reverse_list-2114 | Score: 100% | 2026-02-12T16:09:46.768830

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)