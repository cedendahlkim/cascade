# Task: gen-ll-reverse_list-5540 | Score: 100% | 2026-02-13T09:34:09.725093

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))