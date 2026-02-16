# Task: gen-ll-reverse_list-9463 | Score: 100% | 2026-02-13T14:30:14.691378

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))