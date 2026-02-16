# Task: gen-ds-reverse_with_stack-8194 | Score: 100% | 2026-02-14T12:08:15.759940

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))