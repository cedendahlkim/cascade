# Task: gen-ds-reverse_with_stack-8537 | Score: 100% | 2026-02-17T20:01:56.511229

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))