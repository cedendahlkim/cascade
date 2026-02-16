# Task: gen-ll-reverse_list-1226 | Score: 100% | 2026-02-15T07:46:38.023620

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))