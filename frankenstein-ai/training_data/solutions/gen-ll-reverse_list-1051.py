# Task: gen-ll-reverse_list-1051 | Score: 100% | 2026-02-15T07:53:12.067894

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))