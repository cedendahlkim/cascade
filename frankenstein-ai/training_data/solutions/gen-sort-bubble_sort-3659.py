# Task: gen-sort-bubble_sort-3659 | Score: 100% | 2026-02-13T16:07:19.255330

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in sorted(lst)))