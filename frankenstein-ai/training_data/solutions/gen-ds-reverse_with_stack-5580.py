# Task: gen-ds-reverse_with_stack-5580 | Score: 100% | 2026-02-13T19:48:02.495908

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))