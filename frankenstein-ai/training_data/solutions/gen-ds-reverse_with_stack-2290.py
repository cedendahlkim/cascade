# Task: gen-ds-reverse_with_stack-2290 | Score: 100% | 2026-02-12T16:09:47.014246

n = int(input())
linked_list = []
for _ in range(n):
    linked_list.append(int(input()))

linked_list.reverse()
print(*linked_list)