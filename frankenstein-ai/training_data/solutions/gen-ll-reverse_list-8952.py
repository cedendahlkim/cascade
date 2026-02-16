# Task: gen-ll-reverse_list-8952 | Score: 100% | 2026-02-13T13:39:57.111075

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))