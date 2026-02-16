# Task: gen-ll-reverse_list-7372 | Score: 100% | 2026-02-13T14:30:42.015619

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))