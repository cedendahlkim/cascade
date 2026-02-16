# Task: gen-ll-reverse_list-2134 | Score: 100% | 2026-02-15T12:29:33.754038

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))