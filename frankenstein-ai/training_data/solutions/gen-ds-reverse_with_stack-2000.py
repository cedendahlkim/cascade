# Task: gen-ds-reverse_with_stack-2000 | Score: 100% | 2026-02-13T19:35:18.921418

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))