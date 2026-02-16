# Task: gen-ds-reverse_with_stack-8994 | Score: 100% | 2026-02-15T08:13:44.286352

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))