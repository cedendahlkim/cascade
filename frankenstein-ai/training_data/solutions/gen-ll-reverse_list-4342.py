# Task: gen-ll-reverse_list-4342 | Score: 100% | 2026-02-13T19:14:53.681331

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))