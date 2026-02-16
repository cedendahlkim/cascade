# Task: gen-ll-reverse_list-1948 | Score: 100% | 2026-02-13T18:51:30.947152

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))