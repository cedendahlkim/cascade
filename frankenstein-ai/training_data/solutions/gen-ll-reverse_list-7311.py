# Task: gen-ll-reverse_list-7311 | Score: 100% | 2026-02-15T10:28:52.340369

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))