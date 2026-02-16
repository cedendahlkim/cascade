# Task: gen-ll-reverse_list-6064 | Score: 100% | 2026-02-13T19:06:14.656393

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))