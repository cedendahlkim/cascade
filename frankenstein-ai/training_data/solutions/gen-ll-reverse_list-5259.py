# Task: gen-ll-reverse_list-5259 | Score: 100% | 2026-02-15T12:02:53.621086

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))