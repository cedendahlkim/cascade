# Task: gen-ll-reverse_list-3109 | Score: 100% | 2026-02-15T10:10:05.416179

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))