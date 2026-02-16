# Task: gen-ll-reverse_list-1568 | Score: 100% | 2026-02-13T15:46:45.127710

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))